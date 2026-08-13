export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="text-xs text-muted-foreground">© 2026 — All rights reserved.</span>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground transition">
            Terms
          </a>
          <a href="#" className="hover:text-foreground transition">
            Contact
          </a>
          <a href="#" className="hover:text-foreground transition">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
