// Implementation modules are included via lib.rs
// This file only contains the Rusto struct definition

use crate::types::{
    IbddInAny, IbddOutAny, ITestSpecification, ITestImplementation, 
    IUniversalTestAdapter, ITTestResourceRequest, ITestResourceConfiguration, IFinalResults,
    SuiteFn, GivenFn, WhenFn, ThenFn, IArtifactory,
    ITestJob
};
use std::collections::HashMap;
use std::marker::PhantomData;

pub struct Rusto<I: IbddInAny, O: IbddOutAny, M> {
    pub total_tests: i32,
    pub artifacts: Vec<Box<dyn std::any::Any>>,
    pub assert_this: Box<dyn Fn(I::Then) -> bool>,
    pub given_overrides: HashMap<String, GivenFn>,
    pub specs: Vec<Box<dyn std::any::Any>>,
    pub suites_overrides: HashMap<String, SuiteFn>,
    pub test_jobs: Vec<ITestJob>,
    pub test_resource_requirement: ITTestResourceRequest,
    pub test_specification: Box<dyn ITestSpecification<I, O>>,
    pub then_overrides: HashMap<String, ThenFn>,
    pub when_overrides: HashMap<String, WhenFn>,
    pub test_resource_configuration: Option<ITestResourceConfiguration>,
    pub values_overrides: HashMap<String, Box<dyn Fn(Vec<String>, Vec<Vec<Box<dyn std::any::Any>>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub shoulds_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub expecteds_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub describes_overrides: HashMap<String, Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, I::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub its_overrides: HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any>>>,
    pub test_adapter: Box<dyn IUniversalTestAdapter<I>>,
    pub test_subject: I::Iinput,
    pub phantom_o: PhantomData<O>,
    pub phantom_m: PhantomData<M>,
}
