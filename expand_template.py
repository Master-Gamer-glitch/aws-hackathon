#!/usr/bin/env python3
"""
Locally expands a SAM template into plain CloudFormation using samtranslator.
This avoids the need for CAPABILITY_AUTO_EXPAND and the transform IAM issue.
"""
import json
import yaml
import sys
import boto3

from samtranslator.public.translator import ManagedPolicyLoader
from samtranslator.translator.transform import transform
from samtranslator.yaml_helper import yaml_parse

def ordered_dump(data, stream=None, **kwds):
    """Dump yaml preserving insertion order."""
    class OrderedDumper(yaml.SafeDumper):
        pass
    def _dict_representer(dumper, data):
        return dumper.represent_mapping(
            yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
            data.items()
        )
    OrderedDumper.add_representer(dict, _dict_representer)
    return yaml.dump(data, stream, OrderedDumper, **kwds)

# Read the packaged template (S3 URIs already resolved)
with open('packaged.yaml', 'r') as f:
    sam_template = yaml_parse(f.read())

# Load managed policies from AWS (needed for policy templates like DynamoDBCrudPolicy)
iam = boto3.client('iam', region_name='us-west-2')
managed_policy_map = ManagedPolicyLoader(iam).load()

loader = ManagedPolicyLoader(iam)

try:
    cfn_template = transform(
        sam_template,
        {"Environment": {"Default": "dev", "Type": "String"}},
        loader
    )
except Exception as e:
    print(f"Transform error: {e}", file=sys.stderr)
    import traceback; traceback.print_exc()
    sys.exit(1)

# Write out pure CloudFormation
with open('cfn_expanded.yaml', 'w') as f:
    ordered_dump(cfn_template, f, default_flow_style=False)

print("✅ Expanded template written to cfn_expanded.yaml")
