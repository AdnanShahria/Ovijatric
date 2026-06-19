import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dynamicGet } from '../../utils/apiClient';
import { slugify } from '../../utils/slugify';
import { Loader2, ArrowLeft, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  image_url?: string | null;
  additional_images?: string | null;
  published_at: string | number;
}

export const BlogDetailsPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await dynamicGet<BlogPost>('blog_posts');
        const match = data.find(p => slugify(p.title) === id || p.id === id);
        setPost(match || null);
        if (match) {
          let addImgs: string[] = [];
          try {
            if (match.additional_images) addImgs = JSON.parse(match.additional_images);
          } catch (e) {
            // ignore
          }
          const initialImage = match.image_url || addImgs[0] || '';
          setActiveImage(initialImage);
        }
      } catch (err) {
        console.error('Failed to fetch blog post:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#1B4332]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <h1 className="text-4xl font-bold text-[#1B4332] font-garamond mb-4">Story Not Found</h1>
        <Link to="/#blog" className="text-adventure-orange hover:underline font-semibold flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Stories
        </Link>
      </div>
    );
  }

  let additionalImages: string[] = [];
  try {
    if (post.additional_images) additionalImages = JSON.parse(post.additional_images);
  } catch (e) {
    // ignore
  }

  const allImages = [
    ...(post.image_url ? [post.image_url] : []),
    ...additionalImages
  ];

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-white font-sans">
      <div className="max-w-3xl mx-auto">
        <Link to="/#blog" className="text-adventure-orange font-semibold hover:text-[#1B4332] mb-8 inline-flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Back to Stories
        </Link>
        
        <div className="mb-8 border-b border-slate-100 pb-6">
          <span className="inline-block py-1 px-3 rounded-full bg-adventure-orange/10 text-adventure-orange text-sm font-semibold mb-4 uppercase tracking-wider">
            Expedition Journal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1B4332] font-garamond mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-6 text-slate-500 font-medium text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} className="text-adventure-orange" />
              {new Date(Number(post.published_at)).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <User size={16} className="text-adventure-orange" />
              By Admin
            </span>
          </div>
        </div>

        {activeImage && (
          <div className="w-full mb-8">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-200 mb-4 shadow-md border border-slate-100 relative group">
              <img src={activeImage} alt={post.title} className="w-full h-full object-contain bg-[#eef5ee]" />
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={() => {
                      const currentIndex = allImages.indexOf(activeImage);
                      const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
                      setActiveImage(allImages[prevIndex]);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1B4332] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={() => {
                      const currentIndex = allImages.indexOf(activeImage);
                      const nextIndex = (currentIndex + 1) % allImages.length;
                      setActiveImage(allImages[nextIndex]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1B4332] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar justify-center">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-adventure-orange opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      </div>
    </div>
  );
};
