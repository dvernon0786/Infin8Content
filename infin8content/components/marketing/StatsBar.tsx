import { Zap, Clock, Star, Users } from 'lucide-react';

const StatsBar = () => {
  const stats = [
    { icon: <Zap className="w-12 h-12" />, value: "500K+", label: "Articles Created" },
    { icon: <Clock className="w-12 h-12" />, value: "80%", label: "Faster Creation" },
    { icon: <Star className="w-12 h-12" />, value: "4.8/5", label: "User Rating" },
    { icon: <Users className="w-12 h-12" />, value: "50+", label: "Team Seats" },
  ];

  return (
    <section className="bg-white border-y border-neutral-200 section-padding-mobile md:section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center group">
              <div className="flex justify-center mb-3 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <div className="text-h3-desktop text-h3-mobile text-neutral-900 font-bold mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-small text-neutral-600 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
