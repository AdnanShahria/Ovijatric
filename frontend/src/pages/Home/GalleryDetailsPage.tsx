import { useParams, Link } from 'react-router-dom';

export const GalleryDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        <Link to="/#gallery" className="text-white/60 hover:text-white mb-8 inline-block transition-colors">
          &larr; Back to Gallery
        </Link>
        <div className="w-full aspect-[16/9] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
          <p className="text-white text-xl">Gallery Item {id} View</p>
        </div>
      </div>
    </div>
  );
};
