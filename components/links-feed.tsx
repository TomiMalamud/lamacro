import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { navigationLinks } from "./navigation";

export default function LinksFeed() {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {navigationLinks.map((feature) => (
              <Link
                key={feature.label}
                href={feature.href}
                className="block transition-transform"
              >
                <Card className="h-full border-gray-100 dark:border-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition-colors border">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-7 text-gray-900 dark:text-gray-50">
                      {feature.label}
                    </h3>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
