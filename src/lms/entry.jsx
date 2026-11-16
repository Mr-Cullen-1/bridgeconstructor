import BridgeMaster from "../games/bridge-master/BridgeMaster.jsx";
import styles from "../games/bridge-master/styles/bridge-master.css?inline";

export const bridgeMasterManifest = Object.freeze({
  contractVersion: 1,
  gameId: "bridge-master",
  version: "1.0.0",
  runtime: "react-19",
  requiredCapabilities: ["webgl2"],
  levelIds: ["bridge-01", "bridge-02", "bridge-03", "bridge-04", "bridge-05"],
});

export default function BridgeMasterLms({ styleNonce, ...props }) {
  return (
    <>
      <style nonce={styleNonce}>{styles}</style>
      <BridgeMaster {...props} />
    </>
  );
}
