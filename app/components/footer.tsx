import { Link } from '@remix-run/react';
import { ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-lg font-semibold"></p>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Open source software
            </p>
          </div>

          <div className="flex space-x-4">
            <Link
              to="https://github.com/hackbg/chainlink-datastreams-transmitter"
              className="flex text-gray-400 hover:text-white transition"
            >
              <ExternalLink className="size-5" />
              <span className="ml-1">GitHub Repository</span>
            </Link>
            <Link
              to="https://docs.chain.link/data-streams"
              className="flex text-gray-400 hover:text-white transition"
            >
              <ExternalLink className="size-5" />
              <span className="ml-1">Official Data Streams Documentation</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
