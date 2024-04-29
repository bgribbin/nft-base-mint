import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="w-full bg-white py-4 px-8 shadow-sm">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center space-x-6">
          <img
            alt="Logo"
            className="h-24"
            height="200"
            src="/bugs.webp"
            style={{
              //   aspectRatio: '100/40',
              objectFit: 'contain',
            }}
            // width="100"
          />
        </div>
        <nav className="flex items-center space-x-6">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </nav>
      </div>
    </header>
  );
}
