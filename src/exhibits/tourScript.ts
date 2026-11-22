import type { PlateKind } from '../editorial/plates/plateTypes'

export const tourScript = {
  hardware: {
    name: 'MORPH',
    beats: [
      ['The package', 'Whoa, the lid comes off! See the pins around the edge? Eight of them are MORPH’s crew. Vlastimir can give each one a job at a particular clock cycle.', 'Take me closer'],
      ['Inside the die', 'See those little gold loops? In this cutaway they connect the die to its package. Down on the die, a 16-bit instruction tells the engine which pin to drive, sample, or release.', 'Can it speak another language?'],
      ['The copper routes', 'Yep! Follow the copper out to the pins. Change the program and the same hardware can speak SPI or UART. Try the Pulse Link trace below. I bet you can spot which pin moves first.', 'Back to the chip'],
    ],
  },
  paths: {
    name: 'Monte Carlo AD Greeks',
    beats: [
      ['One starting price', 'Race you to the other side! Every trail starts at the same price. Each one gets a different sequence of random moves, so they fan out as time passes.', 'What are the moving dots?'],
      ['A slice through time', 'Those dots show all the paths at the same instant. Nudge the starting price and watch what happens to the payout. The sensitivity of the average discounted payout is called Delta.', 'What happens at the finish?'],
      ['Terminal payoffs', 'At the finish a cash-digital option pays a fixed amount or nothing. A tiny nudge can push a path over the line. That’s the bit a naive path-by-path derivative can miss!', 'Back to the paths'],
    ],
  },
  events: {
    name: 'Hawkes-OFI Market Microstructure',
    beats: [
      ['Trade arrivals', 'Look at the tape. Quiet water, then a whole bunch of trades at once! Each upright mark is an arrival. The two sides track buys and sells.', 'Follow that burst'],
      ['A cluster builds', 'There! Several arrivals close together lift the model’s expected trade rate. A new trade gives the curve another kick before the last one has faded.', 'And when it goes quiet?'],
      ['The fading tail', 'Watch the slope after the burst. That memory drains away. Vlastimir tested whether the difference between buy and sell intensity helps explain the next price move.', 'Back to the tape'],
    ],
  },
  graph: {
    name: 'Q-CyberSelect',
    beats: [
      ['The candidate graph', 'All these dots want on board! Each stands for a possible traffic feature. Bring two that tell the same story and you’ve spent two spots on one clue.', 'Who makes the crew?'],
      ['Four selected features', 'The copper dots do. Q-CyberSelect balances how informative a feature is against how much it repeats the others. Its recorded selection kept four of 42.', 'Did they win?'],
      ['The held-out test', 'That’s what the held-out data is for! A simpler four-feature selector scored higher on that split. Vlastimir kept both scores in the log so you can see the comparison.', 'Back to the graph'],
    ],
  },
  shift: {
    name: 'Adaptive-DRST',
    beats: [
      ['Familiar waters', 'Here’s the water our navigator knows. This first cloud stands for the source data the model learned from. See where the observations bunch up?', 'Cross to the other side'],
      ['Between distributions', 'Out here the familiar landmarks thin out. A confident prediction can still be shaky when there are few nearby training examples. That’s where checking support matters.', 'Which points need a check?'],
      ['The target cloud', 'The second cloud is the new territory. Adaptive-DRST uses reliability signals to decide which predictions deserve validation. Try the reliability controls below and see where you’d spend a check.', 'Back to the clouds'],
    ],
  },
  filter: {
    name: 'Prompt Shield',
    beats: [
      ['Incoming text', 'Hold on. We picked up a document, and some of its words sound like orders. Who actually asked us to do what? Follow that line into the first gate.', 'Open the gates'],
      ['Assessing the input', 'Here the reviewer can see the input, its classification, and the reason it was flagged. Imagine being able to ask the lookout exactly what they spotted.', 'What gets through?'],
      ['Reviewing the report', 'Follow the traces out. This prototype gives the reviewer a report to inspect alongside the original task. Try the three review stages below and make your own call.', 'Back to the filter'],
    ],
  },
} as const satisfies Record<PlateKind, {name:string; beats:readonly (readonly [string,string,string])[]}>
