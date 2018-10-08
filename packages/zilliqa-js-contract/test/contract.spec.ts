import BN from 'bn.js';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {HTTPProvider} from 'zilliqa-js-core';
import {Wallet} from 'zilliqa-js-account';
import {ContractStatus, Contracts} from '../src/index';
import {abi} from './test.abi';
import {testContract} from './fixtures';

const mock = new MockAdapter(axios);
const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);
wallet.create();

describe('Contracts', () => {
  afterEach(() => {
    mock.reset();
  });

  it('should be able to construct a fresh contract instance', async () => {
    const contractFactory = new Contracts(provider, wallet);
    const contract = contractFactory.new(abi, testContract, [
      {
        vname: 'contractOwner',
        type: 'ByStr20',
        value: '0x124567890124567890124567890124567890',
      },
      {vname: 'name', type: 'String', value: 'NonFungibleToken'},
      {vname: 'symbol', type: 'String', value: 'NFT'},
    ]);

    mock
      .onPost()
      .replyOnce(200, {
        result: {nonce: 1},
      })
      .onPost()
      .replyOnce(200, {
        result: {TranID: 'some_hash'},
      })
      .onPost()
      .replyOnce(200, {
        result: {
          ID: 'some_hash',
          receipt: {
            success: true,
            cumulative_gas: 1000,
          },
        },
      });

    const deployTx = await contract.deploy(new BN(1000), new BN(1000));

    expect(deployTx.status).toEqual(ContractStatus.Deployed);
  });

  it('should not swallow network errors', async () => {
    const contractFactory = new Contracts(provider, wallet);
    const contract = contractFactory.new(abi, testContract, [
      {
        vname: 'contractOwner',
        type: 'ByStr20',
        value: '0x124567890124567890124567890124567890',
      },
      {vname: 'name', type: 'String', value: 'NonFungibleToken'},
      {vname: 'symbol', type: 'String', value: 'NFT'},
    ]);

    mock
      .onPost()
      .replyOnce(200, {
        result: {nonce: 1},
      })
      .onPost()
      .replyOnce(200, {
        result: {TranID: 'some_hash'},
      })
      .onPost()
      .replyOnce(400);

    await expect(contract.deploy(new BN(1000), new BN(1000))).rejects.toThrow(
      /Request failed/g,
    );
  });

  it('if the underlying transaction is unsuccessful, status should be rejected', async () => {
    const contractFactory = new Contracts(provider, wallet);

    mock
      .onPost()
      .replyOnce(200, {
        result: {nonce: 1},
      })
      .onPost()
      .replyOnce(200, {
        result: {TranID: 'some_hash'},
      })
      .onPost()
      .replyOnce(200, {
        result: {
          ID: 'some_hash',
          receipt: {
            success: false,
            cumulative_gas: 1000,
          },
        },
      });

    const contract = await contractFactory
      .new(abi, testContract, [
        {
          vname: 'contractOwner',
          type: 'ByStr20',
          value: '0x124567890124567890124567890124567890',
        },
        {vname: 'name', type: 'String', value: 'NonFungibleToken'},
        {vname: 'symbol', type: 'String', value: 'NFT'},
      ])
      .deploy(new BN(1000), new BN(1000));

    expect(contract.status).toEqual(ContractStatus.Rejected);
  });
});
