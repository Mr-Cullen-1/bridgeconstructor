import BridgeMaster from "../games/bridge-master/BridgeMaster.jsx";
import styles from "../games/bridge-master/styles/bridge-master.css?inline";
import pageReset from "../games/bridge-master/styles/page-reset.css?inline";
import { levels } from "../games/bridge-master/levels/index.js";

export const bridgeMasterManifest = Object.freeze({
  contractVersion: 1,
  gameId: "bridge-master",
  version: "1.2.0",
  runtime: "react-19",
  requiredCapabilities: [],
  levelIds: levels.map((level) => level.id),
});

export default function BridgeMasterLms({ styleNonce, ...props }) {
  return (
    <>
      <style nonce={styleNonce}>{pageReset + styles}</style>
      <BridgeMaster {...props} />
    </>
  );
}
