import Link from "next/link";

type ProfileBadgeProps = {
  email?: string;
  name?: string;
  avatarUrl?: string;
};

export function ProfileBadge({ email, name, avatarUrl }: ProfileBadgeProps) {
  const displayName = name?.trim() || email?.split("@")[0] || "Account";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Link className="profile-badge" href="/dashboard" aria-label={`Open ${displayName}'s profile`}>
      {avatarUrl ? <img className="profile-avatar" src={avatarUrl} alt="" /> : <span className="profile-avatar profile-initial">{initial}</span>}
      <span className="profile-badge-copy">
        <strong>{displayName}</strong>
        <small>My profile</small>
      </span>
    </Link>
  );
}
