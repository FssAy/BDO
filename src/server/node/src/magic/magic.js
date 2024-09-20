import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

sessionless.getKeys = async () => {
  return await db.getKeys();
};
    
const fountURL = 'http://localhost:3006/';

const MAGIC = {
  joinup: async (spell) => {
    const gateway = await gatewayForSpell(spell.spellName);
    spell.gateways.push(gateway);

    const spellbook = await db.get('spellbook');
    const nextIndex = spellbook.destinations.indexOf(spellbook.destinations.find(($) => $.stopName === 'bdo'));
    const nextDestination = spellbook.destinations[nextIndex].stopURL;

    const res = await MAGIC.forwardSpell(spell, nextDestination);
    const body = await res.json();

    if(!body.success) {
      return body;
    }

    if(!body.uuids) {
      body.uuids = [];
    }
    body.uuids.push({
      service: 'bdo',
      uuid: 'continuebee'
    });

    return body;
  },

  linkup: async (spell) => {
    const gateway = await gatewayForSpell(spell.spellName);
    spell.gateways.push(gateway);

    const res = await MAGIC.forwardSpell(spell, fountURL);
    const body = await res.json();
    return body;
  },

  gatewayForSpell: async (spellName) => {
    const bdo = await db.getUser('bdo');
    const gateway = {
      timestamp: new Date().getTime() + '',
      uuid: bdo.uuid, 
      minimumCost: 20,
      ordinal: bdo.ordinal
    };      

    const message = gateway.timestamp + gateway.uuid + gateway.minimumCost + gateway.ordinal;

    gateway.signature = await sessionless.sign(message);

    return gateway;
  },

  forwardSpell: async (spell, destination) => {
    return await fetch(destination, {
      method: 'post',
      body: JSON.stringify(spell),
      headers: {'Content-Type': 'application/json'}
    });
  }
};

export default MAGIC;
