import { useParams, Link } from 'react-router-dom';

export const BlogDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <Link to="/#blog" className="text-adventure-orange font-semibold hover:text-[#1B4332] mb-8 inline-block transition-colors">
          &larr; Back to Stories
        </Link>
        
        <div className="mb-12 border-b border-slate-100 pb-8">
          <span className="inline-block py-1 px-3 rounded-full bg-adventure-orange/10 text-adventure-orange text-sm font-semibold mb-4">
            Expeditions
          </span>
          <h1 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-6">Adventure Story {id}</h1>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>May 15, 2026</span>
            <span>•</span>
            <span>By Admin</span>
          </div>
        </div>

        <div className="prose prose-lg max-w-none text-slate-700">
          <p>This is the detailed view for blog post {id}. When connected to the admin panel, this content will be loaded dynamically from the database.</p>
          <p>Ovijatrik members have shared countless memories and this space will serve as an archive for all those adventures.</p>
        </div>
      </div>
    </div>
  );
};
