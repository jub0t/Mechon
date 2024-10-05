import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { Cpu, HardDrive, TriangleRight } from "lucide-react";
import BarGraph from "./components/BarGraph";
import { ByteFormat } from "../lib/formatter";
import core from "@/core";
import { Tracker } from "@/components/tremor/Tracker";
import WelcomeBanner from "./components/WelcomeBanner";

const data = [
  // array-start
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-red-600", tooltip: "Error" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-red-600", tooltip: "Error" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-yellow-600", tooltip: "Warn" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  { color: "bg-emerald-600", tooltip: "Tracker Info" },
  // array-end
]


export default async function Home() {
  const serverInfo = await core.getServerInfo();
  console.log(serverInfo)

  return (
    <main className="flex flex-wrap w-full">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center px-4 py-2 w-full">
          <h1 className="text-xl font-bold">Welcome Back, admin</h1>
          <TabsList className="ml-auto">
          </TabsList>
        </div>

        <Separator />
      </Tabs>

      <section className="w-full justify-center p-8 flex flex-wrap">
        <div className="grid-cols-3 grid gap-4 w-full">
          <Card className="w-full p-4 flex flex-col justify-between h-full" >
            <section>
              <h1 className="items-center gap-2 flex">
                <span>
                  <HardDrive className="w-3 h-3" />
                </span>
                <span className="text-xs">
                  STORAGE
                </span>
              </h1>
            </section>

            <section className="mt-auto">
              <h1 className="text-xl font-bold text-secondary-foreground">
                <span>
                  {Math.floor(serverInfo.storage.free / 1000 / 1000 / 1000)
                    || 'N/A'}
                </span>
                <span>
                  {' '}
                </span>
                <span>
                  GB
                </span>
              </h1>

              <div className="flex justify-between w-full">
                <div>
                  <h4 className="text-xs">STORAGE LEFT</h4>
                </div>

                <div className="text-xs">
                  <h3>
                    <span> Total: </span> <span>
                      {ByteFormat("gigabyte").format(
                        Math.floor(serverInfo.storage.total / 1000 / 1000 / 1000)
                      )
                        || 'N/A'
                      }
                    </span>
                  </h3>
                </div>
              </div>
            </section>
          </Card>

          <Card className="w-full p-4 flex flex-col justify-between h-full">
            <section>
              <h1 className="items-center gap-2 flex">
                <span>
                  <TriangleRight className="w-3 h-3" />
                </span>
                <span className="text-xs">
                  MEMORY
                </span>
              </h1>
            </section>

            <section className="mt-auto">
              <h1 className="text-xl font-bold text-secondary-foreground">
                <span>
                  {
                    ((serverInfo.memory.total - serverInfo.memory.free) / 1000 / 1000 / 1000).toFixed(2)
                    || 'N/A'}
                </span>
                <span>
                  {' '}
                </span>
                <span>
                  GB
                </span>
              </h1>

              <div className="flex justify-between w-full">
                <div>
                  <h4 className="text-xs">USED RAM</h4>
                </div>

                <div className="text-xs">
                  <h3>
                    <span> Total: </span> <span>
                      {ByteFormat("megabyte").format(
                        Math.floor(serverInfo.memory.total / 1000 / 1000 / 1000)
                      )}
                    </span>
                  </h3>
                </div>
              </div>
            </section>
          </Card>

          <Card className="w-full p-4 flex flex-col justify-between h-full">
            <section>
              <h1 className="items-center gap-2 flex">
                <span>
                  <Cpu className="w-3 h-3" />
                </span>
                <span className="text-xs">
                  PROCESSOR
                </span>
              </h1>
            </section>

            <section className="mt-auto">
              <h1 className="text-xl font-bold text-secondary-foreground">
                <span>
                  {serverInfo.processor.cpus.length}x {serverInfo.processor.cpus[0].speed / 1000}
                </span>
                <span>
                  {' '}
                </span>
                <span>
                  GHz
                </span>
              </h1>

              <div className="flex justify-between w-full">
                <div>
                  <h4 className="text-sm">CPU</h4>
                </div>

                <div className="text-sm">
                  <h3>
                    <span> Used: </span> <span>
                      {(100 - Math.random() * 30).toFixed(2)}%
                    </span>
                  </h3>
                </div>
              </div>
            </section>
          </Card>
        </div>
      </section>
    </main>
  );
}
