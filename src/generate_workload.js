import fs from 'fs';

const TOTAL_OPERATIONS = 500;

const VALID_CASES = [
  {
    opAlias: 'operator-marco',
    devAlias: 'welding-robot-09',
    actions: ['SWITCH_ON', 'MOVE_UP', 'MOVE_DOWN', 'SWITCH_OFF']
  },
  {
    opAlias: 'operator-elena',
    devAlias: 'cnc-lathe-01',
    actions: ['SWITCH_ON', 'ROTATE', 'CUT', 'SWITCH_OFF']
  }
];

const INVALID_CASES = [
  {
    opAlias: 'operator-elena',
    devAlias: 'welding-robot-09',
    actions: ['SWITCH_OFF', 'MOVE_UP']
  },
  {
    opAlias: 'operator-marco',
    devAlias: 'welding-robot-09',
    actions: ['ROTATE', 'CUT']
  }
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWorkload() {
  const workload = [];

  for (let i = 0; i < TOTAL_OPERATIONS; i++) {
    const useValid = Math.random() < 0.8;
    const pool = useValid ? VALID_CASES : INVALID_CASES;
    const selected = randomItem(pool);
    const action = randomItem(selected.actions);

    workload.push({
      opAlias: selected.opAlias,
      devAlias: selected.devAlias,
      action
    });
  }

  fs.writeFileSync('workload.json', JSON.stringify(workload, null, 2));
  console.log(`Generated ${TOTAL_OPERATIONS} operations in workload.json`);
}

generateWorkload();