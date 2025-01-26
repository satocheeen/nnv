import styles from "./page.module.css";
import Graph from "./_components/chart/Graph";

export default function Home() {

  return (
    <div>
      {/* <Guide /> */}
      <div className={styles.Graph}>
            <Graph />
      </div>
      {/* <ControlPanel /> */}
      {/* {createPageDialogTarget &&
          <CreatePageDialog show={showCreatePageDialog} onHide={onCreatePageDialogHide} target={createPageDialogTarget}/>
      } */}
      {/* <AlertDialog /> */}
  </div>
  );
}
