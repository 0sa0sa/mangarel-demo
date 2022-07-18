export const sleep = (msec: number) =>
  // 以下の部分で eslint エラー発生.
  // Return values from promise executor functions cannot be read.eslintno-promise-executor-return
  // new Promise<void>((resolve) => setTimeout(() => resolve(), msec));
  // 解決策： https://github.com/eslint/eslint/issues/13668#issuecomment-688431006
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), msec);
  });
