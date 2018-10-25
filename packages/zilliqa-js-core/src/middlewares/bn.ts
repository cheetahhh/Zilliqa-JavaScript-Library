import BN from 'bn.js';
import * as _ from 'lodash';
import { RPCMethod } from '../net';
import { ResMiddlewareFn } from '../util';

const RPC_METHOD_BN_FIELDS_MAP = new Map<RPCMethod, string[]>([
  [RPCMethod.GetBalance, ['balance']],
  [RPCMethod.GetDSBlock, ['blockNum', 'nonce']],
  [
    RPCMethod.GetTxBlock,
    [
      'header.BlockNum',
      'header.DSBlockNum',
      'header.GasLimit',
      'header.GasUsed',
    ],
  ],
  // TODO: add more
]);

const fn: ResMiddlewareFn = (res) => {
  const method = res.req.payload.method;
  const bnFields = RPC_METHOD_BN_FIELDS_MAP.get(method);
  if (!bnFields) {
    return res;
  }
  bnFields.forEach((field) => {
    const strValue: string = _.get(res.result, field);
    if (strValue) {
      _.set(res.result, field, new BN(strValue));
    }
  });
  return res;
};

export default fn;
