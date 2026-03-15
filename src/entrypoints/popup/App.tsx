import { useState } from "react";
import "./App.css";

import { loadData, logMessage, PopupData, saveData } from "./commands";
import { Response } from "@/src/typing/commands";

function App() {
  // const [count, setCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("No errors yet");
  const [popupData, setPopupdata] = useState<PopupData>({ count: 0 });

  useEffect(() => {
    async function execute() {
      await logMessage("Hello from Loop Video!");
    }
    execute();
  }, []);

  function handleResponse(response: Response<unknown>) {
    if (!response.success) {
      setErrorMsg(response.message);
    }
  }

  function setCount(setter: (prevCount: number) => number) {
    setPopupdata(prev => {
      return {
        ...prev,
        count: setter(prev.count)
      }
    })
  }

  return (
    <>
      <h1>Loop Video</h1>
      <div className="card">
        <button
          onClick={async () => {
            const response = await logMessage("Hello from button press! Wow!");
            handleResponse(response);
            setCount((count) => count + 1);
          }}
        >
          count is {popupData.count}
        </button>
        <button
          onClick={async () => {
            const response = await saveData(popupData);
            handleResponse(response);
          }}>
            Save state
        </button>
        <button onClick={async () => {
          const response = await loadData();
          handleResponse(response);
          if (response.success) {
            setPopupdata(_prev => response.data)
          }
        }}>
          Load state
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p>{errorMsg}</p>
    </>
  );
}

export default App;
