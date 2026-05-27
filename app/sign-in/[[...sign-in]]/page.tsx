import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="login">
      {/* Branded left panel */}
      <div className="login-brand">
        <div className="login-brand-mark">LF Creative</div>

        <div className="login-strip" aria-hidden="true">
          <div className="login-strip-card" />
          <div className="login-strip-card" />
          <div className="login-strip-card" />
          <div className="login-strip-card" />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
          <h1 className="login-brand-title">A quiet place for loud work.</h1>
          <p className="login-brand-sub">
            Deliver dailies, masters, and final cuts to clients with versioned files,
            expiring links, and zero email attachments. Built for the way we actually
            ship work.
          </p>
        </div>

        <div className="login-brand-foot">
          <span>© LF Creative · Brooklyn / London</span>
          <span>Status · all systems normal</span>
        </div>
      </div>

      {/* Clerk sign-in form */}
      <div className="login-form-wrap">
        <SignIn
          appearance={{
            elements: {
              rootBox: { width: "100%", maxWidth: 380 },
              card: {
                background: "transparent",
                boxShadow: "none",
                padding: 0,
                width: "100%",
              },
              headerTitle: {
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--text-strong)",
              },
              headerSubtitle: {
                color: "var(--text-muted)",
                fontSize: 14,
              },
              formButtonPrimary: {
                background: "var(--accent)",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 10,
                height: 42,
              },
              formFieldInput: {
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 14,
                background: "var(--surface)",
              },
              formFieldLabel: {
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
