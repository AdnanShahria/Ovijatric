import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dynamicGet } from '../../utils/apiClient';
import { slugify } from '../../utils/slugify';
import { Loader2, ArrowLeft, Image as ImageIcon, Calendar } from 'lucide-react';

interface GalleryItem {
  id: string;
  image_url: string;
  category: string;
  caption?: string | null;
  uploaded_at: string | number;
}

export const GalleryDetailsPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await dynamicGet<GalleryItem>('gallery');
        const match = data.find(g => 
          g.id === id || 
          slugify(g.caption || '') === id || 
          `${slugify(g.caption || 'photo')}-${g.id}` === id
        );
        setItem(match || null);
      } catch (err) {
        console.error('Failed to fetch gallery item:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-8 text-white">
        <h1 className="text-4xl font-bold font-garamond mb-4 text-[#e0a82e]">Memory Not Found</h1>
        <Link to="/#gallery" className="text-white/60 hover:text-white hover:underline font-semibold flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-black text-white font-sans flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <Link to="/#gallery" className="text-white/60 hover:text-white mb-8 inline-flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Back to Gallery
        </Link>
        
        <div className="w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10 relative group">
          <img src={item.image_url} alt={item.caption || 'Gallery photo'} className="w-full h-full object-contain bg-black" />
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-sky-400">
            {item.category}
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          {item.caption && (
            <h1 className="text-2xl sm:text-3xl font-bold font-garamond text-slate-100 mb-4 leading-tight">
              {item.caption}
            </h1>
          )}
          <div className="flex items-center gap-4 text-white/40 text-xs sm:text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-adventure-orange" />
              Uploaded on {new Date(Number(item.uploaded_at)).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
