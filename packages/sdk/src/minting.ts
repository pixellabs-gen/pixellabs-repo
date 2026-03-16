import { ethers } from 'ethers';
import type { NFTMetadata } from '@pixellabs/core';

export const ERC721_MINT_ABI = [
  'function safeMint(address to, string uri) returns (uint256)',
];

export interface MintingConfig {
  contractAddress: string;
  signer: ethers.Signer;
}

export class MintingClient {
  private readonly contract: ethers.Contract;

  constructor(config: MintingConfig) {
    if (!config.contractAddress) {
      throw new Error('contractAddress is required for minting');
    }
    this.contract = new ethers.Contract(
      config.contractAddress,
      ERC721_MINT_ABI,
      config.signer
    );
  }

  async safeMint(to: string, tokenUri: string): Promise<ethers.ContractTransactionResponse> {
    return this.contract.safeMint(to, tokenUri);
  }

  async mintWithMetadata(
    to: string,
    metadata: NFTMetadata
  ): Promise<ethers.ContractTransactionResponse> {
    const tokenUri = this.createTokenUri(metadata);
    return this.safeMint(to, tokenUri);
  }

  createTokenUri(metadata: NFTMetadata): string {
    const json = JSON.stringify(metadata);
    const encoded = Buffer.from(json, 'utf8').toString('base64');
    return `data:application/json;base64,${encoded}`;
  }
}
