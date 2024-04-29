'use client';
import { Button } from '@/components/ui/button';
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount,
  useReadContracts,
  useChainId,
} from 'wagmi';

import { abi } from '../nft_abi';
import { useEffect } from 'react';

const BASE_URL = 'https://gray-worthwhile-scorpion-903.mypinata.cloud/ipfs/';

const MINT_CHAIN_ID = 8453;

function convertIpfsUrl(ipfsUrl: string): string {
  const cidRegex = /ipfs:\/\/([a-zA-Z0-9]+)/;
  const match = ipfsUrl.match(cidRegex);
  if (match) {
    const cid = match[1];
    return `https://ipfs.io/ipfs/${cid}/0.json`;
  } else {
    throw new Error('Invalid IPFS URL');
  }
}

const contractConfig = {
  abi,
  address: '0x10e509E1392ce1acdcB88341ECaE2B93De409dA4',
} as const;

export default function Mint() {
  const { data: name, isError } = useReadContract({
    ...contractConfig,
    functionName: 'name',
  });
  const { data: totalSupplyMinted, refetch: refetchSupplyMinted } =
    useReadContract({
      ...contractConfig,
      functionName: 'totalSupplyMinted',
    });

  const { data: totalSupply } = useReadContract({
    ...contractConfig,
    functionName: 'MAX_SUPPLY',
  });

  const { isConnected, address } = useAccount();

  const {
    data: hash,
    writeContract: mint,
    isPending: isMintLoading,
    isSuccess: isMintStarted,
  } = useWriteContract();

  const {
    data: txData,
    isSuccess: txSuccess,
    isPending: txPending,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  const chainId = useChainId();

  const isMintChain = chainId === MINT_CHAIN_ID;

  const { data: userBalance } = useReadContract({
    functionName: 'balanceOf',
    args: [address || '0x'],
  });

  const { data: firstNft } = useReadContract({
    ...contractConfig,
    functionName: 'tokenURI',
    args: [0n],
  });

  const fetchImage = async (uri: string) => {
    const totalUri = convertIpfsUrl(uri);
    try {
      const response = await fetch(totalUri);
      const metadata = await response.json();
      const image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      return image;
    } catch (error) {
      console.log('error', error);
    }
  };

  const { data: balanceOfAddress, isSuccess: Success } = useReadContract({
    ...contractConfig,
    functionName: 'balanceOf',
    args: [address || '0x'],
    query: {
      enabled: isConnected,
    },
  });

  let contracts = [];
  if (balanceOfAddress) {
    for (let i = 0; i < balanceOfAddress; i++) {
      contracts.push({
        abi,
        functionName: 'tokenOfOwnerByIndex',

        args: [address || '0x', BigInt(i)],
      });
    }
  }

  const { data: tokens } = useReadContracts({
    contracts: contracts,
    query: {
      enabled: balanceOfAddress !== undefined,
    },
  });

  // useEffect(() => {
  //     if (tokens && tokens.length > 0) {
  //         const fetchImages = async () => {
  //             const images = await Promise.all(
  //                 tokens.map((token) => fetchImage(token.result as string))
  //             );
  //             setImages(images);
  //         };
  //         fetchImages();
  //     }
  // }, [tokens]);

  const isMinted = txSuccess;

  useEffect(() => {
    if (isMinted) {
      refetchSupplyMinted();
    }
  }, [isMinted]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex flex-col items-center justify-center space-y-6 py-12 px-8 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">{name}</h1>
        <p className="max-w-md text-center text-gray-600">
          A limited edition free mint collection from Based Bugs. Bugs as
          always, is BASED.
        </p>
        <div className="w-80 h-80 bg-blue-100 rounded-lg">
          <img
            alt="NFT"
            className="w-full h-full object-cover rounded-lg"
            height="320"
            src="/outline.webp"
            style={{ aspectRatio: '320/320', objectFit: 'contain' }}
            width="320"
          />
        </div>
        {address && (
          <Button
            className="bg-[#8A2BE2] hover:bg-[#8A2BE2] text-white px-8 py-3 rounded-full w-full"
            disabled={isMintLoading || !isMintChain}
            onClick={() =>
              mint?.({
                ...contractConfig,
                functionName: 'safeMint',
                args: [address],
              })
            }
          >
            {isMintLoading
              ? 'Minting...'
              : isMintChain
              ? 'Mint'
              : 'Mint on Base'}
          </Button>
        )}

        {isMintChain && (
          <>
            <div className="text-gray-600">
              Total Minted:{' '}
              {totalSupplyMinted?.toString() + '/' + totalSupply?.toString()}
            </div>
          </>
        )}

        {isMinted && (
          <div className="">
            <h2 style={{ marginTop: 24, marginBottom: 6 }}>NFT Minted!</h2>
            <p style={{ marginBottom: 24 }}>
              Your NFT will show up in your wallet in the next few minutes.
            </p>
            <p style={{ marginBottom: 6 }}>
              View on{' '}
              <a target="_blank" href={`https://basescan.org/tx/${hash}`}>
                Basescan
              </a>
            </p>
            <p>
              View on{' '}
              <a href={`https://opensea.io/assets/base/${txData?.to}/1`}>
                Opensea
              </a>
            </p>
          </div>
        )}
        {/* {isConnected && (
          <div>
            <h2 className="text-xl font-bold mb-2">My NFTs minted:</h2>
            <p>Number minted: {userBalance?.toString()}</p>
            <div>
              {images.map((image, index) => (
                <img key={index} src={image} alt="NFT" />
              ))}
            </div>
          </div>
        )} */}
        {/* {tokens && <div>{JSON.stringify(tokens.data)}</div>} */}
      </main>
    </div>
  );
}
