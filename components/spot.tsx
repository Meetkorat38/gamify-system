import { Image } from "expo-image";
import { type ImageStyle } from "expo-image";

const BASE = "https://8328-irgeqkvr1pb6lunquf4vz-7914b151.sg2.manus.computer";

const ASSETS = {
  hero: "/manus-storage/async-images/gB8KHYVNmNfX99E0onAOg3/image-1.webp",
  career: "/manus-storage/async-images/gB8KHYVNmNfX99E0onAOg3/image-2.webp",
  english: "/manus-storage/async-images/gB8KHYVNmNfX99E0onAOg3/image-3.webp",
  health: "/manus-storage/async-images/gB8KHYVNmNfX99E0onAOg3/image-4.webp",
  reward: "/manus-storage/async-images/gB8KHYVNmNfX99E0onAOg3/image-5.webp",
} as const;

export type SpotName = keyof typeof ASSETS;

export function Spot({ name, size = 56, style }: { name: SpotName; size?: number; style?: ImageStyle }) {
  return (
    <Image
      source={{ uri: `${BASE}${ASSETS[name]}` }}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      transition={400}
    />
  );
}
