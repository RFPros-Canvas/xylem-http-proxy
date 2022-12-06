# ./dstack.sh xylem http-proxy dev liquid-dev
# ./dstack.sh xylem http-proxy test liquid-dev
# ./dstack.sh xylem http-proxy prod liquid-prod

STACK=$1
APPLICATION=$2
ENV=$3
PROFILE=$4
APPLICATIONNAME="$STACK-$APPLICATION"

MQTTENVIRONMENT=$ENV
GITORG="RFPros-Canvas"

# grab the current account id
ACCOUNT=$(aws sts get-caller-identity --profile "$PROFILE" | python3 -c "import sys, json; print(json.load(sys.stdin)['Account'])")
echo "Fetched ACCOUNT: $ACCOUNT"

# Define S3 Buckets
ACCOUNTPREFIX=$(echo "$ACCOUNT" | cut -c1-4)
S3ARTIFACTS="$ACCOUNTPREFIX-$APPLICATIONNAME-artifacts-$ENV"

echo $S3ARTIFACTS

# upload the artifacts to the s3 bucket
aws s3 sync ./cfnResources "s3://$S3ARTIFACTS/cloudformation" --profile $PROFILE

if [ "$ENV" = "prod" ]; then
  CONNARN="arn:aws:codestar-connections:us-east-1:524206654849:connection/61b1397d-2aca-403d-b033-571152f9c973"
else
  CONNARN="arn:aws:codestar-connections:us-east-1:278482835815:connection/ee5924d7-da30-4b55-b65b-16849a7b0ef2"
fi

aws cloudformation deploy \
  --profile "$PROFILE" \
  --template-file "cfnResources/cfnStackTemplate.yaml" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --stack-name "$APPLICATIONNAME-$ENV" \
  --parameter-overrides \
    "AccountPrefix=$ACCOUNTPREFIX" \
    "ApplicationName=$APPLICATIONNAME" \
    "ArtifactBucketName=$S3ARTIFACTS" \
    "ConnectionArn=$CONNARN" \
    "Environment=$ENV" \
    "GitOrg=$GITORG" \
    "Stack=$STACK"
