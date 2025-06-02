import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { navMain } from "./navigation";

export default function LinksFeed() {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl md:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <div className="space-y-12">
            {navMain.map((group) => (
              <div key={group.title}>
                <h2 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-neutral-50">
                  {group.title}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {group.items.map((feature) => (
                    <Link
                      key={feature.title}
                      href={feature.url}
                      className="block transition-transform"
                    >
                      <Card className="h-full group rounded-2xl shadow-md border-neutral-100 dark:border-neutral-900 border">
                        <CardContent className="p-4">
                          <div className="flex gap-4 items-center">
                            <Image
                              src={feature.iconSrc}
                              alt={feature.iconAlt}
                              width={64}
                              height={64}
                              className="group-hover:scale-110 transition-transform duration-300"
                            />
                            <div>
                              <h3 className="text-lg font-semibold leading-7 text-neutral-900 dark:text-neutral-50">
                                {feature.title}
                              </h3>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
