var KafkaAvro = require('kafka-avro');

var kafkaAvro = new KafkaAvro({
    kafkaBroker: 'localhost:9092',
    schemaRegistry: 'localhost:8081',
});

// Query the Schema Registry for all topic-schema's
// fetch them and evaluate them.
kafkaAvro.init()
    .then(function() {
        console.log('Ready to use');
    });

kafkaAvro.getProducer({
  // Options listed bellow
})
    // "getProducer()" returns a Bluebird Promise.
    .then(function(producer) {
        var topicName = 'test-topic';

        producer.on('disconnected', function(arg) {
          console.log('producer disconnected. ' + JSON.stringify(arg));
        });

        //Create a Topic object with any options our Producer
        //should use when producing to that topic.
        var topic = producer.Topic(topicName, {
        // Make the Kafka broker acknowledge our message (optional)
        'request.required.acks': 1
        });

        var value = new Buffer('value-22');
        var key = 'key';

        // if partition is set to -1, librdkafka will use the default partitioner
        var partition = -1;
        producer.produce(topic, partition, value, key);
    })
