import { useReducer, useCallback } from "react";

interface FormSubmitState {
    isSubmitting: boolean;
    error: string;
    success: boolean;
}

type FormSubmitAction =
    | { type: "START" }
    | { type: "ERROR"; error: string }
    | { type: "SUCCESS" }
    | { type: "RESET" };

function reducer(_state: FormSubmitState, action: FormSubmitAction): FormSubmitState {
    switch (action.type) {
        case "START":
            return { isSubmitting: true, error: "", success: false };
        case "ERROR":
            return { isSubmitting: false, error: action.error, success: false };
        case "SUCCESS":
            return { isSubmitting: false, error: "", success: true };
        case "RESET":
            return { isSubmitting: false, error: "", success: false };
    }
}

const INITIAL: FormSubmitState = { isSubmitting: false, error: "", success: false };

/**
 * Manages form submit lifecycle: idle → submitting → success/error.
 * Replaces the common isSubmitting + error + success useState triple.
 */
export function useFormSubmit(
    submitFn: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
) {
    const [state, dispatch] = useReducer(reducer, INITIAL);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            dispatch({ type: "START" });

            const formData = new FormData(e.currentTarget);
            const result = await submitFn(formData);

            if (result.error) {
                dispatch({ type: "ERROR", error: result.error });
            } else if (result.success) {
                dispatch({ type: "SUCCESS" });
                (e.target as HTMLFormElement).reset();
            }
        },
        [submitFn]
    );

    const reset = useCallback(() => dispatch({ type: "RESET" }), []);

    return { ...state, handleSubmit, reset };
}
