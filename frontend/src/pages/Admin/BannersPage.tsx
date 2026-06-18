import { Plus, Image as ImageIcon } from 'lucide-react'

export function BannersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manage Banners</h2>
          <p className="text-slate-400 mt-1">Upload and manage homepage banner images</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Banners Yet</h3>
        <p className="text-slate-400 max-w-sm mx-auto mb-6">
          Get started by uploading your first banner. This will be displayed on the main homepage carousel.
        </p>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto">
          <Plus className="w-5 h-5" />
          Upload Image
        </button>
      </div>
    </div>
  )
}
