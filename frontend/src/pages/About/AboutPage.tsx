export const AboutPage = () => {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-8">About <span className="text-adventure-orange">Us</span></h1>
        
        <div className="bg-white rounded-3xl p-12 shadow-xl border border-[#1B4332]/10 text-left">
          <h2 className="text-3xl font-bold text-[#1B4332] font-garamond mb-6">Our Legacy</h2>
          <p className="text-lg text-slate-700 mb-6 leading-relaxed">
            Founded in 2018, the RUET Adventure Club (Ovijatrik) is the premier adventure organization
            of Rajshahi University of Engineering & Technology. We believe in pushing boundaries,
            exploring the unknown, and fostering a spirit of teamwork and resilience among our members.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            From conquering the highest peaks in Bangladesh to organizing large-scale marathons and 
            camping trips, we are dedicated to providing unforgettable experiences. This detailed 
            about page will eventually be editable from the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
};
