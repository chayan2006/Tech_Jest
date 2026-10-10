import Link from "next/link";

type ProfileBadgeProps = {
  email?: string;
  name?: string;
  avatarUrl?: string;
  admin?: boolean;
};

// Opens the client workspace, or the admin console for TechJest admins.
export function ProfileBadge({ email, name, avatarUrl, admin = false }: ProfileBadgeProps) {
  const displayName = name?.trim() || email?.split("@")[0] || "Account";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    // Named by its visible text ("Priya Sharma, My profile") so voice-control users can say what they see.
    <Link className="profile-badge" href={admin ? "/admin" : "/dashboard"}>
      {avatarUrl ? (
        <img className="profile-avatar" src={avatarUrl} alt="" />
      ) : (
        <span className="profile-avatar profile-initial" aria-hidden="true">
          {initial}
        </span>
      )}
      <span className="profile-badge-copy">
        <strong>{displayName}</strong>
        <small>{admin ? "Admin console" : "My profile"}</small>
      </span>
    </Link>
  );
}
