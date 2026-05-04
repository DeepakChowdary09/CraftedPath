import Header from "@/components/ui/Header";

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <footer className="bg-muted/50 py-12 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">Made with ❤️ by Dev · CraftedPath &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
