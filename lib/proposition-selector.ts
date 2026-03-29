type Option = "a" | "b" | "c" | "d";

interface QuestionOptions {
  options: Record<Option, string>;
  correctOption: Option;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds 4 answer options: the correct answer + 3 random false propositions.
 */
export function buildQuestionOptions(
  correctAnswer: string,
  falseProps: string[]
): QuestionOptions {
  const distractors = shuffle(falseProps).slice(0, 3);

  const allOptions = shuffle([correctAnswer, ...distractors]);
  const correctIndex = allOptions.indexOf(correctAnswer);
  const optionKeys: Option[] = ["a", "b", "c", "d"];

  const options = {
    a: allOptions[0],
    b: allOptions[1],
    c: allOptions[2],
    d: allOptions[3],
  } as Record<Option, string>;

  return { options, correctOption: optionKeys[correctIndex] };
}
