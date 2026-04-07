/**
 * Presentation: BaseMap
 *
 * A React component that renders a Leaflet map centred on Geneva.
 * All layer components should be rendered as children of
 * this component so they can access the Leaflet map instance via useMap().
 *
 * Must be used with client:only="react" in Astro pages (Leaflet is DOM-only).
 */
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GENEVA: [number, number] = [46.2028, 6.1472];
const DEFAULT_ZOOM = 15;

interface Props {
  children?: React.ReactNode;
  className?: string;
}

export default function BaseMap({ children, className = "" }: Props) {
  return (
    <MapContainer center={GENEVA} zoom={DEFAULT_ZOOM} className={className}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      />
      {children}
    </MapContainer>
  );
}
