import { Home, Receipt, BookOpenText, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 border-t border-border/50 glass-effect z-50 backdrop-blur-xl shadow-lg">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        <Link
          to="/home"
          className={`flex flex-col items-center justify-center flex-1 transition-all group ${
            isActive('/home') ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
          }`}
        >
          <Home className={`h-5 w-5 mb-1 transition-transform ${isActive('/home') ? 'scale-110' : 'group-hover:scale-105'}`} />
          <span className="text-xs font-semibold">Home</span>
        </Link>

        <Link
          to="/orders"
          className={`flex flex-col items-center justify-center flex-1 transition-all group ${
            isActive('/orders') ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
          }`}
        >
          <Receipt className={`h-5 w-5 mb-1 transition-transform ${isActive('/orders') ? 'scale-110' : 'group-hover:scale-105'}`} />
          <span className="text-xs font-semibold">Orders</span>
        </Link>

        <Link
          to="/blog"
          className={`flex flex-col items-center justify-center flex-1 transition-all group ${
            isActive('/blog') ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
          }`}
        >
          <BookOpenText className={`h-5 w-5 mb-1 transition-transform ${isActive('/blog') ? 'scale-110' : 'group-hover:scale-105'}`} />
          <span className="text-xs font-semibold">Blog</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 transition-all group ${
            isActive('/profile') ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
          }`}
        >
          <User className={`h-5 w-5 mb-1 transition-transform ${isActive('/profile') ? 'scale-110' : 'group-hover:scale-105'}`} />
          <span className="text-xs font-semibold">Profile</span>
        </Link>
      </div>
    </nav>
  );
};
