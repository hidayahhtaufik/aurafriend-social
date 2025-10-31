import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';

let fhevmInstance = null;

async function getInstance() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (fhevmInstance) {
    return fhevmInstance;
  }

  try {
    const config = { ...SepoliaConfig };
    if (window.ethereum) {
      config.network = window.ethereum;
    }
    
    fhevmInstance = await createInstance(config);
    return fhevmInstance;
  } catch (error) {
    throw new Error('Failed to initialize FHE instance');
  }
}

export async function encryptBool(value, contractAddress, userAddress) {
  const instance = await getInstance();
  const buffer = instance.createEncryptedInput(contractAddress, userAddress);
  buffer.addBool(value);
  const ciphertexts = await buffer.encrypt();
  
  return {
    handle: ciphertexts.handles[0],
    inputProof: ciphertexts.inputProof
  };
}

export async function encryptUint64(value, contractAddress, userAddress) {
  const instance = await getInstance();
  const buffer = instance.createEncryptedInput(contractAddress, userAddress);
  const bigIntValue = typeof value === 'bigint' ? value : BigInt(value);
  buffer.add64(bigIntValue);
  const ciphertexts = await buffer.encrypt();
  
  return {
    handle: ciphertexts.handles[0],
    inputProof: ciphertexts.inputProof
  };
}

export async function userDecrypt(ciphertextHandle, contractAddress, signer) {
  const instance = await getInstance();
  const keypair = instance.generateKeypair();
  const handleContractPairs = [{ handle: ciphertextHandle, contractAddress }];
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '10';
  
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    [contractAddress],
    startTimeStamp,
    durationDays
  );
  
  const userAddress = await signer.getAddress();
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );
  
  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    [contractAddress],
    userAddress,
    startTimeStamp,
    durationDays
  );
  
  return result[ciphertextHandle];
}

export async function publicDecrypt(handles) {
  const instance = await getInstance();
  return await instance.publicDecrypt(handles);
}

export { getInstance };
