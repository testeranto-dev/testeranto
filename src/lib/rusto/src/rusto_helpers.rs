use crate::types::{
    IbddInAny, IbddOutAny, ITestSpecification, ITestImplementation, 
    IUniversalTestAdapter, ITTestResourceRequest, ITestResourceConfiguration, IFinalResults,
    SuiteFn, GivenFn, WhenFn, ThenFn,
};
use crate::rusto::Rusto;
use std::collections::HashMap;
use std::marker::PhantomData;

impl<I: IbddInAny + 'static, O: IbddOutAny + 'static, M: 'static> Rusto<I, O, M> {
    /// Simplified version for common use cases
    pub fn new_simple(
        web_or_node: &str,
        input: I::Iinput,
        test_specification: Box<dyn ITestSpecification<I, O>>,
        test_implementation: ITestImplementation<I, O, M>,
        test_adapter: Box<dyn IUniversalTestAdapter<I>>,
    ) -> Self {
        Self::new(
            web_or_node,
            input,
            test_specification,
            test_implementation,
            ITTestResourceRequest::default(),
            test_adapter,
            ITestResourceConfiguration::default(),
            "8080",
            "localhost",
        )
    }
}
