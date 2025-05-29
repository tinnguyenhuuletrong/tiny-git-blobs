import { useState } from "react";
import { Button } from "./components/ui/button";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-svh gap-2">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          Count: {count}
        </h4>
        <Button onClick={(_) => setCount(count + 1)}>Click me</Button>
      </div>
    </>
  );
}

export default App;
