// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  /**
   * @type {{
   *  paymentMethodName: string
   *  products: string
   * }}
   */

  const configuration = JSON.parse(
    input?.paymentCustomization?.metafield?.value ?? "{}",
  );
  if (!configuration.paymentMethodName || !configuration.products) {
    return NO_CHANGES;
  }

  const hidePaymentMethod = input.paymentMethods.find((method) =>
    method.name.includes(configuration.paymentMethodName),
  );

  if (!hidePaymentMethod) {
    return NO_CHANGES;
  }

  const products = JSON.parse(configuration.products);
  const variants = products.map((product) =>
    product.variants.map((variant) => variant?.id),
  );
  const variantIds = variants.flat();
  const productMatches = input.cart?.lines.filter((line) =>
    variantIds.includes(line?.merchandise?.id),
  );

  if (!productMatches.length) {
    console.error(
      "No restricted items present in cart, no need to hide the payment method.",
    );
    return NO_CHANGES;
  }

  return {
    operations: [
      {
        hide: {
          paymentMethodId: hidePaymentMethod.id,
        },
      },
    ],
  };
}
