# Data Classification

BuildTrace separates information classification from customer visibility. A classifier may suggest how to organize a file, but only an authorized builder action can expose it through the customer portal.

## Tiers

| Tier                    | Intended use                                             | Uploaded-document behavior                                                                 |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `public`                | Deliberately unrestricted material                       | Defined in the shared taxonomy but not persisted/selectable for uploaded machine documents |
| `customer-visible`      | Material explicitly approved for a customer              | Private storage remains in use; access is through the QR portal and signed URLs            |
| `internal`              | Normal builder workspace material                        | Default for most uploads                                                                   |
| `sensitive-engineering` | PLC, HMI, CAD, electrical, and related engineering files | Default for sensitive engineering categories; never exposed automatically                  |
| `restricted`            | Highest-sensitivity organizational material              | Retained for narrowly authorized builder access                                            |

The database enum for uploaded documents intentionally omits `public`. A customer-visible file is still private and is not equivalent to an anonymous public object.

## Classification workflow

1. The API validates the upload and selects a secure default from the chosen category.
2. The deterministic classifier examines the filename and file type.
3. The suggestion, confidence, status, and source are stored as metadata.
4. A builder may refresh or explicitly confirm the suggestion.
5. Confirmation changes the category only; it does not change visibility or make the file customer-visible.

The current classifier is rule-based. It does not perform OCR, semantic PLC analysis, vector search, or external AI processing, and uploaded files are not sent to an external model-training path.

## Customer portal rule

The QR portal returns only documents whose stored visibility is `CUSTOMER_VISIBLE` and whose `visibleToCustomer` flag is true. File bytes remain in private Supabase Storage and downloads use temporary signed URLs.
