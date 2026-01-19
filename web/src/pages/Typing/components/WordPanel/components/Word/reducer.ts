import { EXPLICIT_SPACE } from '@/constants';
import type { WordState } from './type';
import { initialWordState } from './type';

export type WordAction =
  | { type: 'INIT'; payload: { displayWord: string; randomLetterVisible: boolean[] } }
  | { type: 'INPUT_UPDATE'; payload: string }
  | { type: 'INPUT_CORRECT'; payload: { inputLength: number; isFinished: boolean } }
  | { type: 'INPUT_WRONG'; payload: { inputLength: number; inputChar: string } }
  | { type: 'RESET_WRONG_STATE' }

export function wordReducer(state: WordState, action: WordAction): WordState {
  switch (action.type) {
    case 'INIT':
      return {
        ...initialWordState,
        displayWord: action.payload.displayWord,
        letterStates: new Array(action.payload.displayWord.length).fill('normal'),
        randomLetterVisible: action.payload.randomLetterVisible,
      };
    case 'INPUT_UPDATE':
      return {
        ...state,
        inputWord: action.payload
      };
    case 'INPUT_CORRECT':
        {
            const newLetterStates = [...state.letterStates];
            if (action.payload.inputLength > 0) {
                newLetterStates[action.payload.inputLength - 1] = 'correct';
            }
            return {
                ...state,
                letterTimeArray: [...state.letterTimeArray, Date.now()],
                correctCount: state.correctCount + 1,
                letterStates: newLetterStates,
                isFinished: action.payload.isFinished
            };
        }
    case 'INPUT_WRONG':
         {
             const wrongLetterStates = [...state.letterStates];
             if (action.payload.inputLength > 0) {
                 wrongLetterStates[action.payload.inputLength - 1] = 'wrong';
             }
             
             const newMistake = { ...state.letterMistake };
             const idx = action.payload.inputLength - 1;
             if (newMistake[idx]) {
                 newMistake[idx] = [...newMistake[idx], action.payload.inputChar];
             } else {
                 newMistake[idx] = [action.payload.inputChar];
             }
    
             return {
                 ...state,
                 letterStates: wrongLetterStates,
                 hasWrong: true,
                 hasMadeInputWrong: true,
                 wrongCount: state.wrongCount + 1,
                 letterTimeArray: [], 
                 letterMistake: newMistake
             };
         }
    case 'RESET_WRONG_STATE':
        return {
            ...state,
            inputWord: '',
            letterStates: new Array(state.letterStates.length).fill('normal'),
            hasWrong: false
        };
    default:
      return state;
  }
}
