"use client"
import { useMemo } from "react";
import styles from "./page.module.css";
import { useAtom } from "jotai";
import { currentDatasetIdAtom } from "./_jotai/operation";
import { dataSetsAtom } from "./_jotai/data";
import Graph from "./_components/chart/Graph";

export default function Home() {
  const [ currentDatasetId ] = useAtom(currentDatasetIdAtom);
  const [ datasets ] = useAtom(dataSetsAtom);
  const currentDataset = useMemo(() => {
      return datasets.find(ds => ds.id === currentDatasetId);
  }, [datasets, currentDatasetId]);

  return (
    <div className="App">
      {/* <Guide /> */}
      <div className={styles.Graph}>
          {currentDataset &&
              <Graph />
          }
      </div>
      {/* <ControlPanel /> */}
      {/* {createPageDialogTarget &&
          <CreatePageDialog show={showCreatePageDialog} onHide={onCreatePageDialogHide} target={createPageDialogTarget}/>
      } */}
      {/* <AlertDialog /> */}
  </div>
  );
}
