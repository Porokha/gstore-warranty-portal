import { BadRequestException } from '@nestjs/common';

export function validatePricingTree(tree: unknown): asserts tree is any[] {
  if (!Array.isArray(tree) || tree.length === 0) {
    throw new BadRequestException('Pricing rules must contain at least one section.');
  }

  tree.forEach((section, sectionIndex) => {
    if (!section || typeof section !== 'object' || !Array.isArray(section.questions)) {
      throw new BadRequestException(`Section ${sectionIndex + 1} must contain questions.`);
    }
    section.questions.forEach((question: any, questionIndex: number) => {
      const location = `Section ${sectionIndex + 1}, question ${questionIndex + 1}`;
      if (!question || typeof question.text !== 'string' || !question.text.trim() || !Array.isArray(question.answers)) {
        throw new BadRequestException(`${location} needs text and answers.`);
      }
      if (question.enabled === false) return;
      const manualReview = question.label === 'pricing_status'
        && question.answers.length === 1
        && question.answers[0]?.attributes?.some((attribute: any) => attribute?.key === 'pricing_status' && attribute?.value === '[manual-review]');
      if (!manualReview && !question.answers.some((answer: any) => answer?.value_enabled !== 0 && answer?.value_enabled !== false && answer?.value_enabled !== '0')) {
        throw new BadRequestException(`${location} needs at least one enabled answer.`);
      }
      question.answers.forEach((answer: any, answerIndex: number) => {
        if (!answer || typeof answer.text !== 'string' || !answer.text.trim() || !Number.isFinite(Number(answer.value ?? 0))) {
          throw new BadRequestException(`${location}, answer ${answerIndex + 1} has invalid text or value.`);
        }
        if (Number(answer.result) !== 2 || answer.value_enabled === 0 || answer.value_enabled === false || answer.value_enabled === '0') return;
        // Some imported legacy trees contain dead-end targets. Preserve them on round trips,
        // but reject malformed references introduced in edited JSON.
        if (!/^[1-9]\d*,[1-9]\d*$/.test(String(answer.go_to || ''))) {
          throw new BadRequestException(`${location}, answer ${answerIndex + 1} needs a section,question target.`);
        }
      });
    });
  });

  if (tree[0]?.enabled === false || !tree[0]?.questions?.some((question: any) => question?.enabled !== false)) {
    throw new BadRequestException('The first section needs an enabled question.');
  }
}
