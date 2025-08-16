import { GitHubData } from "@/app/ui/dashboard/gh";
import { MotionWrapper } from "@/app/ui/motion";
import ThreeDCanvas from "@/app/ui/canvas";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <ThreeDCanvas />
      <h1 className="font-bold text-4xl z-1">Picunada</h1>
      {/* <div>
        <Button>Start journey</Button>
      </div> */}
      <Suspense>
        <MotionWrapper
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
          }}
        >
          <GitHubData />
        </MotionWrapper>
      </Suspense>
    </>
  );
}
