# Assistant grounding evaluation

These are manually prepared examples, not live model results. Each passage is
from [Focus Time Policy](../backend/src/assistant/knowledge/documents/productivity/focus-time-policy.md).
The passage ID is assigned by the current passage splitter. Responses are
mocked examples of what the answer model could return.
For each example the retrieval result is mocked to contain only the cited
passage; actual searches may return additional passages. The built search was
checked for both questions and did retrieve `productivity-focus-time-policy#2`
among its results, but no model was called for this evaluation.

The backend validates the response shape, review metadata, and membership of
source IDs in the retrieved set. The frontend validates the response shape
and review metadata but does not receive the retrieved passages and cannot
check ID membership. Neither independently checks whether a passage supports
the answer. The model is instructed to assess support, but its assessment is
not a verifier. `needsReview: false` is not a guarantee of correctness.

## Known limitations

- Automated model-call tests use mocks; the real OpenAI API integration has
  not been tested for this work.
- A profile-interest question classified as knowledge receives the
  insufficient-evidence fallback if no built-in passages match, even if the
  topic is allowed by the user's profile.
- Review-marked assistant responses can be included as untrusted context in
  later conversation turns; the review flag is not included in that history.

## 1. Supported answer

- **Question:** How long should a focus block for complex work be?
- **Retrieved passage:** `productivity-focus-time-policy#2`

  > ## Planning focus time
  > - Schedule demanding tasks during the user's most productive hours when known.
  > - Prefer dedicated focus blocks of 60 to 120 minutes for complex work.
  > - Break larger tasks into smaller sessions when a long block is unavailable.
  > - Leave breaks between extended periods of concentrated work.
  > - Avoid fragmenting focus time with unnecessary meetings or notifications.

- **Mock model response:** `{"answer":"Prefer a dedicated focus block of 60 to 120 minutes for complex work.","sourceIds":["productivity-focus-time-policy#2"],"needsReview":false,"reasonCode":"supported"}`
- **Claim support:** The recommended duration and its application to complex
  work are explicitly supported by the passage.
- **Expected metadata:** `needsReview: false`, `reasonCode: "supported"`.
- **Evaluation:** Pass on manual review. This does not establish that the
  application independently verified the claim.

## 2. Insufficient evidence

- **Question:** How many focus blocks should I schedule every day?
- **Retrieved passage:** `productivity-focus-time-policy#2`, quoted in case 1.
- **Mock model response:** `{"answer":"The available passage does not specify how many focus blocks to schedule per day.","sourceIds":["productivity-focus-time-policy#2"],"needsReview":true,"reasonCode":"insufficient_evidence"}`
- **Claim support:** The passage gives a duration recommendation but no daily
  count; the statement about the absence of a count is supported by inspection.
- **Expected metadata:** `needsReview: true`,
  `reasonCode: "insufficient_evidence"`.
- **Evaluation:** Pass on manual review. The presence of a retrieved passage
  does not itself mean it answers the question. If retrieval returns no
  passages for a request classified as knowledge, the backend instead returns
  its deterministic insufficient-evidence fallback without an answer-model call.

## 3. Misleading citation

- **Question:** How many focus blocks should I schedule every day?
- **Retrieved passage:** `productivity-focus-time-policy#2`, quoted in case 1.
- **Mock model response:** `{"answer":"Schedule exactly three focus blocks every day.","sourceIds":["productivity-focus-time-policy#2"],"needsReview":false,"reasonCode":"supported"}`
- **Claim support:** The exact count and daily frequency are **not supported**;
  neither appears in the passage.
- **Expected metadata:** The answer should not assert the unsupported count;
  it should acknowledge insufficient evidence with `needsReview: true` and
  `reasonCode: "insufficient_evidence"`.
- **Evaluation:** Fail on manual review. The existing structural checks would
  accept this example because its fields and retrieved ID are valid and its
  metadata is internally consistent. No independent grounding check catches
  the misleading citation.

These examples assess cited text, not the reliability of the underlying
document or evidence outside the retrieved passage. A broader evaluation
would need real model runs, representative queries, and independent human or
other claim-level assessment; none are implied by these examples.
