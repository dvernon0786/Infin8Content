// Unsplash images for trustbar avatars
// Using diverse professional headshots and portraits
export const TRUSTBAR_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507009566169-0ac1ddea312d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c006ae5e?w=100&h=100&fit=crop",
];

export const getTrustbarAvatarHTML = () => {
  return TRUSTBAR_AVATARS.map(
    (src) =>
      `<img src="${src}" alt="User avatar" class="av-img" loading="lazy" />`
  ).join("");
};
