import { Injectable, signal } from '@angular/core';

export interface Position { lat: number; lng: number; }

// Gère la localisation de l'utilisateur (GPS du navigateur) et les calculs de distance.
@Injectable({ providedIn: 'root' })
export class LocationService {
  // position de l'utilisateur, partagée par toutes les pages (null = pas encore localisé)
  position = signal<Position | null>(null);
  loading = signal(false);
  error = signal('');

  // Demande la position au navigateur (le navigateur affiche une demande d'autorisation)
  locate(): Promise<Position | null> {
    this.error.set('');
    if (!('geolocation' in navigator)) {
      this.error.set("La géolocalisation n'est pas supportée par ce navigateur");
      return Promise.resolve(null);
    }
    this.loading.set(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.position.set(p);
          this.loading.set(false);
          resolve(p);
        },
        (err) => {
          this.loading.set(false);
          this.error.set(
            err.code === err.PERMISSION_DENIED
              ? 'Autorisation refusée : activez la localisation dans le navigateur'
              : 'Impossible de récupérer votre position',
          );
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  // Distance en km entre deux points (formule de Haversine)
  distanceKm(a: Position, b: Position): number {
    const rad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Transforme des coordonnées en adresse lisible (OpenStreetMap Nominatim, gratuit).
  // On utilise fetch() et non HttpClient pour ne jamais envoyer notre token à un site externe.
  async addressFrom(p: Position): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=fr&lat=${p.lat}&lon=${p.lng}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('reverse geocoding failed');
      const data = await res.json();
      return data.display_name ?? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
    } catch {
      return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
    }
  }
}
