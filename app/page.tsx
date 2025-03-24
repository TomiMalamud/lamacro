import LinksFeed from '@/components/links-feed';

export default function Home() {
  return (
    <main className="pb-44 mx-auto px-6 sm:px-16 relative bg-gradient-to-t from-sky-200/60 to-transparent dark:from-sky-400/20 dark:to-background">
      <div className="space-y-4">
      <h1 className="text-4xl font-bold text-center mt-10">
        Datos de la Economía Argentina
      </h1>
      <p className="text-center text-lg text-gray-600 dark:text-gray-400">
        Tocá la herramienta que necesitás 👇 
      </p>
      </div>
      <LinksFeed />
    </main>
  );
}
