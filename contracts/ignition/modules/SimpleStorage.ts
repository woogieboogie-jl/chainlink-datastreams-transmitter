// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const SimpleStorageModule = buildModule('SimpleStorage', (m) => {
  const storage = m.contract('SimpleStorage');

  return { lock: storage };
});

export default SimpleStorageModule;
